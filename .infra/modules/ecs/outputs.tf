output "alb_dns" {
  description = "ALB DNS name to access the app"
  value       = var.alb_dns
}

output "backend_url" {
  value = "http://${var.alb_dns}/api"
}

output "frontend_url" {
  value = "http://${var.alb_dns}"
}
