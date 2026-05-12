variable "cluster_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "backend_image" {
  type = string
}

variable "frontend_image" {
  type = string
}

variable "db_host" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "redis_host" {
  type = string
}

variable "alb_sg_id" {
  type = string
}

variable "backend_tg_arn" {
  type = string
}

variable "frontend_tg_arn" {
  type = string
}

variable "alb_dns" {
  type = string
}