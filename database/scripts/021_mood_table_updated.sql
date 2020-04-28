insert into db_logs (`dev`, scriptName) values ('ritu', '021_mood_table_updated.sql');

ALTER TABLE `mood`
add COLUMN `imageUrl` varchar(5000) DEFAULT NULL,
add COLUMN `hi` varchar(100) DEFAULT NULL,
add COLUMN `en` varchar(100) DEFAULT NULL,
add COLUMN `or` varchar(100) DEFAULT NULL,
add COLUMN `ta` varchar(100) DEFAULT NULL;

UPDATE `lokpoll`.`language` SET `isActive`='0' WHERE `id`='4';
UPDATE `lokpoll`.`language` SET `isActive`='0' WHERE `id`='5';
UPDATE `lokpoll`.`language` SET `isActive`='0', `addedOn`=NULL WHERE `id`='6';
