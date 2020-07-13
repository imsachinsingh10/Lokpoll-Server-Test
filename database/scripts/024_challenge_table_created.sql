insert into db_logs (`dev`, scriptName) values ('ritu', '024_challenge_table_created.sql');

drop table if exists challenge;
CREATE TABLE `challenge` (
	`id` bigint(20) NOT NULL AUTO_INCREMENT,
	`moodId` bigint(20) DEFAULT 0,
	`languageCode` varchar(20) DEFAULT NULL,
	`topic` varchar(250) DEFAULT NULL,
	`description` longtext DEFAULT NULL,
	`posterUrl` longtext DEFAULT NULL,
	`startDate` datetime DEFAULT null,
	`deadlineDate` datetime DEFAULT null,
	`resultAnnounceDate` datetime DEFAULT null,
    `createdAt` datetime DEFAULT null,
	PRIMARY KEY (`id`)
);

drop table if exists user_challenge;
CREATE TABLE `user_challenge` (
	`id` bigint(20) NOT NULL AUTO_INCREMENT,
	`userId` bigint(20) DEFAULT 0,
	`challengeId` bigint(20) DEFAULT 0,
    `createdAt` datetime DEFAULT null,
	PRIMARY KEY (`id`)
);
