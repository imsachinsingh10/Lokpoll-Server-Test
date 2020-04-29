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

ALTER TABLE `lokpoll`.`post_reaction`
RENAME TO  `lokpoll`.`post_trust` ;

drop table if exists post_reaction;
CREATE TABLE `post_reaction` (
	`id` bigint(20) NOT NULL AUTO_INCREMENT,
    `postId` bigint(20) DEFAULT 0,
    `reactedBy` bigint(20) DEFAULT 0,
    `type` varchar(100) DEFAULT NULL,
    `reactedAt` datetime DEFAULT NULL,
    PRIMARY KEY (`id`)
);
