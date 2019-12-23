insert into db_logs (`dev`, scriptName) values ('ritu', '013_columns_added_in_post_table.sql');

ALTER TABLE `post`
add COLUMN `isDeleted` tinyint(2) DEFAULT 0;
