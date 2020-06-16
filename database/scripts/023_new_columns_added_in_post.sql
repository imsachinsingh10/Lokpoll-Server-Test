insert into db_logs (`dev`, scriptName) values ('ritu', '023_new_columns_added_in_post.sql');

alter table post
add column languageCode varchar(20);
