# Task Definition — blueprint for backend container
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.cluster_name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"       
  cpu                      = "256"          # 0.25 vCPU
  memory                   = "512"          # 512 MB
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = var.backend_image
    essential = true

    portMappings = [{
      containerPort = 5000
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV",    value = "production" },
      { name = "PORT",        value = "5000" },
      { name = "DB_HOST",     value = var.db_host },
      { name = "DB_PORT",     value = "5432" },
      { name = "DB_NAME",     value = "shopnow" },
      { name = "DB_USER",     value = "shopnow" },
      { name = "DB_PASSWORD", value = var.db_password },
      { name = "REDIS_HOST",  value = var.redis_host },
      { name = "REDIS_PORT",  value = "6379" },
      {name: "DB_SSL", value: "true"}
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.cluster_name}"
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "backend"
      }
    }
  }])
}

# ECS Service — keeps backend tasks running
resource "aws_ecs_service" "backend" {
  name            = "${var.cluster_name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.backend_tg_arn
    container_name   = "backend"
    container_port   = 5000
  }

  service_registries {
    registry_arn = aws_service_discovery_service.backend.arn
  }

  depends_on = [aws_ecs_cluster.main]
}