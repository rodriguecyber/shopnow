# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = var.cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = var.cluster_name }
}

# IAM role for ECS task execution (pulls images, writes logs)
resource "aws_iam_role" "execution" {
  name = "${var.cluster_name}-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM role for ECS task (what your app can access)
resource "aws_iam_role" "task" {
  name = "${var.cluster_name}-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

# Security group for ECS tasks
resource "aws_security_group" "tasks" {
  name        = "${var.cluster_name}-tasks-sg"
  description = "Allow traffic from ALB and between tasks"
  vpc_id      = var.vpc_id

  # Allow traffic from ALB
  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [var.alb_sg_id]
  }

  # Allow tasks to talk to each other (service discovery)
  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true             # ← frontend can reach backend
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.cluster_name}-tasks-sg" }
}

# CloudWatch log group
resource "aws_cloudwatch_log_group" "main" {
  name              = "/ecs/${var.cluster_name}"
  retention_in_days = 7
}

# Cloud Map namespace — creates shopnow.local DNS zone
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "shopnow.local"
  description = "Service discovery for shopnow ECS"
  vpc         = var.vpc_id

  tags = { Name = "${var.cluster_name}-namespace" }
}

# Backend service discovery — backend.shopnow.local
resource "aws_service_discovery_service" "backend" {
  name = "backend"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }

  tags = { Name = "${var.cluster_name}-backend-sd" }
}

# Frontend service discovery — frontend.shopnow.local
resource "aws_service_discovery_service" "frontend" {
  name = "frontend"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }

  tags = { Name = "${var.cluster_name}-frontend-sd" }
}