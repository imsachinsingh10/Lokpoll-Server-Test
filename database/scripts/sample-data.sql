-- -----------------------------------------------------
-- Sample data
-- -----------------------------------------------------

delete from userrole where id > 0;
INSERT INTO `userrole` (`id`,`name`) VALUES (1,'super admin');
INSERT INTO `userrole` (`id`,`name`) VALUES (2,'content creator');
INSERT INTO `userrole` (`id`,`name`) VALUES (3,'user');

delete from user where id > 0;
INSERT INTO `user` (`id`,`firstName`,`lastName`,`email`,`alternateEmail`,`password`,`residentialAddress`,`imageUrl`,`adharUrl`,`passportUrl`,`phone`,`country`,`roleId`,`workingStatus`,`loginStatus`,`regDate`,`lastLogin`,`lastSeen`,`phoneOTP`) VALUES (1,'Super','Admin','sa@aeon.com','sa2@aeon.com','1234','noida',NULL,NULL,NULL,'8006619568','india',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
UPDATE `user` SET `roleId` = '1', `workingStatus` = 'active' WHERE (`id` = '1');
