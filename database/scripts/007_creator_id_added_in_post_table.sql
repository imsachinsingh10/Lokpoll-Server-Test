insert into db_logs (`dev`, scriptName) values ('himanshu', '007_creator_id_added_in_post_table.sql');

ALTER TABLE `post`
add column `creatorId` bigint(20);

ALTER TABLE `post_media`
add column `thumbnailUrl` longtext DEFAULT NULL;
