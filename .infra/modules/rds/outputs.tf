output "endpoint" {
  value = aws_db_instance.main.endpoint
}
output "host" {
  value = split(":", aws_db_instance.main.endpoint)[0]
}