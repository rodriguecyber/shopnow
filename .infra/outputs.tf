output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "backend_ecr_url" {
  description = "ECR URL for backend image"
  value       = module.ecr.backend_url
}

output "frontend_ecr_url" {
  description = "ECR URL for frontend image"
  value       = module.ecr.frontend_url
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.endpoint
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache.endpoint
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions to assume via OIDC (set as the AWS_ROLE_ARN repo secret)"
  value       = module.github_oidc.role_arn
}