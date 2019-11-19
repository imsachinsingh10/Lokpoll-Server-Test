-- -----------------------------------------------------
-- Sample data
-- -----------------------------------------------------

delete from userRole where id > 0;
INSERT INTO `userRole` (`id`,`name`) VALUES (1,'super admin');
INSERT INTO `userRole` (`id`,`name`) VALUES (2,'content creator');
INSERT INTO `userRole` (`id`,`name`) VALUES (3,'user');

delete from user where id > 0;
INSERT INTO `user` (`id`,`firstName`,`lastName`,`email`,`alternateEmail`,`password`,`residentialAddress`,`imageUrl`,`adharUrl`,`passportUrl`,`phone`,`country`,`roleId`,`workingStatus`,`loginStatus`,`regDate`,`lastLogin`,`lastSeen`,`phoneOTP`) VALUES (1,'Super','Admin','sa@aeon.com','sa2@aeon.com','1234','noida',NULL,NULL,NULL,'8006619568','india',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
UPDATE `user` SET `roleId` = '1', `workingStatus` = 'active' WHERE (`id` = '1');

INSERT INTO `lokpoll`.`language` (`name`, `code`, `isActive`) VALUES ('odiya', 'or', '1');
INSERT INTO `lokpoll`.`language` (`name`, `code`, `isActive`) VALUES ('hindi', 'hi', '1');
INSERT INTO `lokpoll`.`language` (`name`, `code`, `isActive`) VALUES ('english', 'en', '1');
INSERT INTO `lokpoll`.`language` (`name`, `code`, `isActive`) VALUES ('marathi', 'mr', '1');
INSERT INTO `lokpoll`.`language` (`name`, `code`, `isActive`) VALUES ('gujarati', 'gu', '1');
INSERT INTO `lokpoll`.`language` (`name`, `code`, `isActive`) VALUES ('bengali', 'bn', '1');
