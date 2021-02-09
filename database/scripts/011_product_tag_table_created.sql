insert into db_logs (`dev`, scriptName) values ('himanshu', '011_product_tag_table_created.sql');

-- -----------------------------------------------------
-- Table `product_tag`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `product_tag`;
create table product_tag (
	name varchar(100) unique not null
);
