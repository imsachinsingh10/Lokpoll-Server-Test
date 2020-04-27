insert into db_logs (`dev`, scriptName) values ('ritu', '020_columns_added_in_post_table.sql');

ALTER TABLE `post`
add COLUMN `isPostUpload` varchar(50) DEFAULT NULL;

ALTER TABLE `post`
add COLUMN `language` varchar(50) DEFAULT NULL;
