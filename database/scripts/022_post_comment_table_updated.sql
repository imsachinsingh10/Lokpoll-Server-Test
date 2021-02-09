insert into db_logs (`dev`, scriptName) values ('ritu', '022_post_comment_table_updated.sql');

ALTER TABLE `post_comment`
add COLUMN `isDeleted` tinyint(2) DEFAULT 0;
