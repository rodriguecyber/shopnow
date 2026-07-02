variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "shopnow-ecs"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "shopnow"
}

variable "db_username" {
  description = "PostgreSQL username"
  type        = string
  default     = "shopnow"
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
  default     = "Shopnow1234"
}

variable "github_repo" {
  description = "GitHub repo allowed to assume the CI/CD role, as \"org/repo\""
  type        = string
  default     = "rodriguecyber/shopnow"
}