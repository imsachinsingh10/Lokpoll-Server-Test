insert into db_logs (`dev`, scriptName) values ('ritu', '017_columns_added_in_user_table.sql');

ALTER TABLE `user`
add COLUMN `audioUrl` varchar(200) DEFAULT NULL;
