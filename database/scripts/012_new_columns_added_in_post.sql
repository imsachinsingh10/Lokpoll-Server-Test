insert into db_logs (`dev`, scriptName) values ('himanshu', '012_new_columns_added_in_post.sql');

alter table post
add column profileType varchar(20),
add column type varchar(20);
