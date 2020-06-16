insert into db_logs (`dev`, scriptName) values ('ritu', '023_new_columns_added_in_post.sql');

alter table post
add column languageCode varchar(20);

UPDATE `lokpoll`.`post` SET `languageCode`='en' WHERE `language` = 'English' and id > 0;
UPDATE `lokpoll`.`post` SET `languageCode`='hi' WHERE `language` = 'Hindi' and id > 0;
UPDATE `lokpoll`.`post` SET `languageCode`='ta' WHERE `language` = 'Sambalpuri' and id > 0;
UPDATE `lokpoll`.`post` SET `languageCode`='or' WHERE `language` = 'Odiya' and id > 0;

UPDATE `lokpoll`.`language` SET `name`='Sambalpuri/Koshli' WHERE `id`='7';
UPDATE `lokpoll`.`language` SET `translation`='ସମ୍ବଲପୁରୀ/କୋଶଲି' WHERE `id`='7';