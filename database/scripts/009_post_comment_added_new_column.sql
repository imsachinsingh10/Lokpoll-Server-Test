insert into db_logs (`dev`, scriptName) values ('himanshu', '009_post_comment_added_new_column.sql');

ALTER TABLE `post_comment`
add COLUMN `level` int NULL DEFAULT 0 ;
