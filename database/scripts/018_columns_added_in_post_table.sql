insert into db_logs (`dev`, scriptName) values ('ritu', '018_columns_added_in_post_table.sql');

ALTER TABLE `post`
add COLUMN `source` varchar(200) DEFAULT NULL;
