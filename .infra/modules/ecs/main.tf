# Reuse existing VPC data
data "aws_vpc" "main" {
  id = var.vpc_id
}
