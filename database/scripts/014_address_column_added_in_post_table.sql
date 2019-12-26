insert into db_logs (`dev`, scriptName) values ('himanshu', '014_address_column_added_in_post_table.sql');

alter table post add column address varchar(500) after longitude;

alter table profile
add column `type` varchar(20) DEFAULT NULL,
add column `imageUrl` varchar(500) DEFAULT NULL,
change column `name` `name` varchar(100) DEFAULT NULL,
CHANGE COLUMN `userId` `userId` BIGINT(20) NULL DEFAULT NULL ,
drop column `profileTypeId`;
