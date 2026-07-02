variable "cluster_name" {
  type = string
}

variable "github_repo" {
  description = "GitHub repo allowed to assume this role, as \"org/repo\""
  type        = string
}

variable "github_branch" {
  description = "Branch allowed to assume this role (the CI/CD workflow only pushes images from this branch)"
  type        = string
  default     = "main"
}

variable "ecr_repository_arns" {
  description = "ECR repository ARNs the role is allowed to push images to"
  type        = list(string)
}
