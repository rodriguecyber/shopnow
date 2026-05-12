output "alb_dns" {
  value = aws_lb.main.dns_name
}

output "alb_sg_id" {
  value = aws_security_group.alb.id
}

output "backend_tg_arn" {
  value = aws_lb_target_group.backend.arn
}

output "frontend_tg_arn" {
  value = aws_lb_target_group.frontend.arn
}