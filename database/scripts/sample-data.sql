-- -----------------------------------------------------
-- Sample data
-- -----------------------------------------------------

delete from user_role where id > 0;
INSERT INTO `user_role` (`id`,`name`) VALUES (1,'super admin');
INSERT INTO `user_role` (`id`,`name`) VALUES (2,'content creator');
INSERT INTO `user_role` (`id`,`name`) VALUES (3,'user');

delete from user where id > 0;
INSERT INTO `user` (`id`, `name`, `email`, `password`, `roleId`, `workingStatus`, `loginStatus`, `avatarBG`) VALUES ('1', 'Admin', 'admin@localbol.com', 'Bharat@2020', '1', 'active', 'online', '#4c5264');

INSERT INTO `language` (`id`,`name`,`code`,`isActive`,`addedOn`,`position`,`translation`) VALUES (1,'Odia','or',1,NULL,NULL,'ଓଡ଼ିଆ');
INSERT INTO `language` (`id`,`name`,`code`,`isActive`,`addedOn`,`position`,`translation`) VALUES (2,'Hindi','hi',1,NULL,NULL,'हिन्दी');
INSERT INTO `language` (`id`,`name`,`code`,`isActive`,`addedOn`,`position`,`translation`) VALUES (3,'English','en',1,NULL,NULL,'अंग्रेज़ी');
INSERT INTO `language` (`id`,`name`,`code`,`isActive`,`addedOn`,`position`,`translation`) VALUES (4,'Marathi','mr',0,NULL,NULL,'मराठी');
INSERT INTO `language` (`id`,`name`,`code`,`isActive`,`addedOn`,`position`,`translation`) VALUES (5,'Gujarati','gu',0,NULL,NULL,'गुजराती');
INSERT INTO `language` (`id`,`name`,`code`,`isActive`,`addedOn`,`position`,`translation`) VALUES (6,'Bengali','bn',0,NULL,NULL,'बंगाली');
INSERT INTO `language` (`id`,`name`,`code`,`isActive`,`addedOn`,`position`,`translation`) VALUES (7,'Sambalpuri','ta',1,NULL,NULL,'ସମ୍ବଲପୁରୀ');

INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`) VALUES (1,'Party',NULL,1,NULL,'#0000ff');
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`) VALUES (2,'Masti',NULL,1,NULL,'#ff00ff');
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`) VALUES (3,'Happy',NULL,1,NULL,'#ffff00');
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`) VALUES (4,'Sad',NULL,1,NULL,'#8080ff');

/*
-- Query: SELECT * FROM lokpoll.mood
LIMIT 0, 1000

-- Date: 2020-05-11 14:17
*/
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (20,'Test',NULL,1,NULL,'#baf1be','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsq934cEIn-1588060952264-admin.png','king in hindi','King','king in odiya','kind in sambalpuri',0,0);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (23,NULL,'2020-05-02 17:23:46',1,NULL,'#9dbcdb','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsyx7MJzYU-1588929861432-5 News Bol.png','खबर बोल','News Bol','ନ୍ୟୁଜ୍ ','ନ୍ୟୁଜ୍ ',1,2);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (24,NULL,'2020-05-04 12:39:28',1,NULL,'#b0d9f0','https://common-storage.cloudjiffy.net/lokpoll/mood_iconssUoTIUVq-1588921222551-3 Viral bol.png','वायरल','Viral','ଭାଇରାଲ୍ ','ଭାଇରାଲ୍ ',1,16);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (25,NULL,'2020-05-06 09:03:50',1,NULL,'#d4a39e','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsPz9NDoJ2-1588920661806-6 Talent Bol.png','प्रतिभा बोल','Talent Bol','ପ୍ରତିଭା','ପ୍ରତିଭା',1,5);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (26,NULL,'2020-05-07 18:09:35',1,NULL,'#b0d9f0','https://common-storage.cloudjiffy.net/lokpoll/mood_icons8ZSsPlHt-1588920396373-1 kuch bhi bol.png','कुछ भी बोल','Kuchbhi Bol','କିଛି ବି ବୋଲ୍‌/','ମନ୍‌ଇଚ୍ଛା ବୋଲ୍‌',1,1);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (27,NULL,'2020-05-08 08:43:46',101,NULL,'#d4a39e','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsqcQh8h48-1588927426551-2 Lockdown bol.png','Lockdown Bol','Lockdown Bol','Lockdown Bol','Lockdown Bol',1,4);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (28,NULL,'2020-05-08 08:51:03',101,NULL,'#baf1be','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsPQ0QQlVh-1588927862302-4 Trending Bol.png','Trending Bol','Trending Bol','Trending Bol','Trending Bol',0,0);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (29,NULL,'2020-05-08 08:53:24',101,NULL,'#9abda7','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsLTNtODgJ-1588928003555-7 Talent Bol.png','Puzzles','Puzzles','Puzzles','Puzzles',1,9);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (30,NULL,'2020-05-08 09:00:28',101,NULL,'#9dbcdb','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsCsdEeaMk-1588928427328-8 Greetings Bol.png','Greetings','Greetings','Greetings','Greetings',1,17);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (31,NULL,'2020-05-08 09:30:12',101,NULL,'#e2cad8','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsSFbTZR0s-1588930212002-9 Entertainment Bol.png','Entertainment','Entertainment','Entertainment','Entertainment',1,29);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (32,NULL,'2020-05-08 09:31:16',101,NULL,'#ede2e8','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsIhX10Knt-1588930276701-10 Music Bol.png','Songs & Music','Songs & Music','Songs & Music','Songs & Music',1,28);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (33,NULL,'2020-05-08 09:33:47',101,NULL,'#d4a39e','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsA9uTqsLx-1588930427591-11 Food Bol.png','Food bol','Food bol','Food bol','Food bol',1,6);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (34,NULL,'2020-05-08 09:35:03',101,NULL,'#f1e1bf','https://common-storage.cloudjiffy.net/lokpoll/mood_iconssiX8vqMg-1588930503452-13 Neighbour Bol.png','Ask Neighbour','Ask Neighbour','Ask Neighbour','Ask Neighbour',1,10);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (35,NULL,'2020-05-08 09:36:21',101,NULL,'#9edbbc','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsTBqHHvXR-1588930580793-12 Challenge Bol.png','Challenges','Challenges','Challenges','Challenges',1,8);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (36,NULL,'2020-05-08 14:07:31',101,NULL,'#baf1be','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsPIMspN7q-1588946851023-14 DIY Craft Bol.png','खुद से करें','DIY Craft','ନିଜେ କରନ୍ତୁ (DIY)','ନିଜେ କରୁନ୍‌ (DIY)',1,7);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (37,NULL,'2020-05-08 14:09:11',101,NULL,'#f1e1bf','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsdl8QIdME-1588946951690-15 Learning Bol.png','शिक्षा','Learning','ଅଧ୍ୟୟନ','ସିଖ୍‌ବାର୍',1,25);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (38,NULL,'2020-05-08 14:11:07',101,NULL,'#9edbbc','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsXn28iiLE-1588947066949-16 People Bol.png','लोगों के बारे में','People','ଜନତା ସ୍ୱର','ଲୋକ୍ ମାନ୍‌କର୍ ବାବଦ୍‌ରେ',1,22);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (39,NULL,'2020-05-08 14:12:07',101,NULL,'#9edbbc','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsR7HqASTF-1588947127268-17 Places Bol.png','जगहों के बारे में','Places','ଜାଗା ବିଷୟରେ','ଜାଗା ବାବଦ୍‌ରେ',1,23);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (40,NULL,'2020-05-08 14:13:03',101,NULL,'#d4a39e','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsHebhCYxz-1588947183250-18 Causes Bol.png','कारण','Social Causes','ମହତ କାର୍ଯ୍ୟ','ଭଲ୍ କାମ୍',1,19);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (41,NULL,'2020-05-08 14:14:15',101,NULL,'#4a7db6','https://common-storage.cloudjiffy.net/lokpoll/mood_iconso7XpBduI-1588947255188-19 Fitness Bol.png','स्वास्थ','Fitness','ସ୍ୱାସ୍ଥ୍ୟ','ଫିଟ୍‌ନେସ୍',1,33);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (42,NULL,'2020-05-08 14:15:46',101,NULL,'#ede2e8','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsJCGvLqlz-1588947346510-20 Gratitude Bol.png','आभार/ धन्यवाद बोल','Gratitude Bol','କୃତଜ୍ଞତା','କୃତଜ୍ଞତା ',1,13);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (43,NULL,'2020-05-08 14:17:49',101,NULL,'#d4a39e','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsucigVqqG-1588947469951-21 Gardening Bol.png','बागवानी','Gardening','ବଗିଚା କାମ','ବଗିଚା କାମ୍‌',1,35);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (44,NULL,'2020-05-08 14:19:01',101,NULL,'#dec6e6','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsZKgKYuCL-1588947541925-22 Spritual Bol.png','आध्यात्म','Spiritual','ଆଧ୍ୟାତ୍ମିକ','ଆଧ୍ୟାତ୍ମିକ୍',1,15);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (45,NULL,'2020-05-08 14:19:53',101,NULL,'#f3ebc3','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsAQbS9Big-1588947593371-23 Memories Bol.png','यादों के बारे में','Memories','ସ୍ମୃତି','ସ୍ମୃତି',1,12);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (46,NULL,'2020-05-08 14:20:52',101,NULL,'#baf1be','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsZKzTbpTR-1588947652644-24 Complain Bol.png','शिकायत बोल','Complain Bol','ଅଭିଯୋଗ','କମ୍ଲେନ୍',0,0);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (47,NULL,'2020-05-08 14:21:51',101,NULL,'#e2cad8','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsM8TsRe3P-1588947711588-25 Confession Bol.png','गलती स्वीकार','Confession','ସ୍ୱିକାରୋକ୍ତି','ସ୍ୱିକାରୋକ୍ତି',1,14);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (48,NULL,'2020-05-08 14:22:49',101,NULL,'#b5d8eb','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsF5PA19bA-1588947769090-26 Development  Bol.png','विकास हुआ बोल','Development Bol','ବିକାଶ','ଡେଭେଲପ୍‌ମେଣ୍ଟ୍',0,0);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (49,NULL,'2020-05-08 14:23:40',101,NULL,'#dec6e6','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsXXxeSyRU-1588947820206-27 Reviews Bol.png','समिक्षा','Reviews','ସମୀକ୍ଷା','ତଦାରଖ୍',1,30);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (50,NULL,'2020-05-08 14:24:36',101,NULL,'#d4a39e','https://common-storage.cloudjiffy.net/lokpoll/mood_iconskmROMYj0-1588947876117-29 Fashion Bol.png','फैशन','Fashion','ଫ୍ୟାସନ','ଫେସନ୍',1,34);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (51,NULL,'2020-05-08 14:25:33',101,NULL,'#b0d9f0','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsu8z9CGYt-1588947933414-30 Cricket Bol.png','क्रिकेट','Cricket','କ୍ରିକେଟ୍','କ୍ରିକେଟ୍',1,31);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (52,NULL,'2020-05-08 14:26:36',101,NULL,'#9dbcdb','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsyazKAvqg-1588947996658-32 Sports Bol.png','खेल','Sports','କ୍ରୀଡ଼ା','ଖେଲ୍‌କୁଦ୍',1,32);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (53,NULL,'2020-05-08 14:27:51',101,NULL,'#f2bbf5','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsuhSsZPSx-1588948071283-31 Travel Bol.png','सफर','Travel & Adventure','ଭ୍ରମଣ ସମ୍ବନ୍ଧ','ବୁଲାବୁଲି',0,41);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (54,NULL,'2020-05-08 14:38:28',101,NULL,'#d4a39e','https://common-storage.cloudjiffy.net/lokpoll/mood_iconszOnxzJxm-1588948707647-33 HomeDecore  Bol.png','घर की सजावट','Home Decor','ଘର ସଜ୍ଜିକରଣ','ଘର୍ ସଜାବର୍‌',1,36);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (55,NULL,'2020-05-08 14:39:52',101,NULL,'#f2c9c7','https://common-storage.cloudjiffy.net/lokpoll/mood_iconssRQopv5t-1588948792731-34 Bikes & Cars  Bol.png','कार और बाइक','Bikes & Cars Bol','ବାଇକ୍‌ ଓ କାର୍‌','ବାଇକ୍ ଓ କାର୍‌',0,38);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (56,NULL,'2020-05-08 14:41:36',101,NULL,'#edbab7','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsMEC0muRY-1588948896452-35 Moile & Gadgets Bol.png','मोबाइल और उपकरण','Mobile & Gadgets Bol','ମୋବାଇଲ୍ ଓ ଗେଜେଟ୍‌ସ','ମୋବାଇଲ୍ ଗେଜେଟ୍‌ସ',0,39);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (57,NULL,'2020-05-08 14:42:44',101,NULL,'#fbbebb','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsZqdEHYBb-1588948964235-36 Animal & Pets  Bol.png','पशु और पालतू जानवर के बारे में','Animal & Pets','ଜୀବଜନ୍ତୁ ଓ ପୋଷା ଜୀବ','ଜୀବଜନ୍ତୁ ଓ ପୁଷା ଜୀବ',0,37);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (58,NULL,'2020-05-08 14:43:53',101,NULL,'#a3c5bc','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsNuI13z3B-1588949033366-37 Sciece & technology Bol.png','विज्ञान और तकनीक','Science & Technology Bol','ବିଜ୍ଞାନ ଓ ପ୍ରଯୁକ୍ତିବିଦ୍ୟା','ବିଜ୍ଞାନ ଓ ପ୍ରଯୁକ୍ତିବିଦ୍ୟା',0,40);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (59,NULL,'2020-05-08 14:44:40',101,NULL,'#acd2c7','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsZVMPU3xF-1588949080212-38 Parenting Bol.png','परवरिश के बारे में बोल','Parenting Bol','ପାଳନ-ପୋଷଣ','ପାଲନ୍ ପୋଷନ୍‌',0,42);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (60,NULL,'2020-05-08 14:45:45',101,NULL,'#87d8fb','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsbzfxru0I-1588949145386-43 Mindfulness Bol.png','सचेत रहना बोल','Mindfulness Bol','ମାଇଣ୍ଡ୍‌ଫୁଲ୍‌ନେସ୍‌','ମାଇଣ୍ଡ୍‌ଫୁଲ୍‌ନେସ୍‌',0,0);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (61,NULL,'2020-05-09 12:03:23',101,NULL,'#4a7db6','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsveN84sKM-1589025802562-5 News Bol.png','Local Info Bol','Local Info Bol','Local Info Bol','Local Info Bol',1,3);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (62,NULL,'2020-05-09 12:10:56',101,NULL,'#e6e6c2','https://common-storage.cloudjiffy.net/lokpoll/mood_icons3JKkqzSq-1589037657640-13 Neighbour Bol.png','Local Notice Board','Local Notice Board','Local Notice Board','Local Notice Board',1,11);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (63,NULL,'2020-05-09 12:12:10',101,NULL,'#4a7db6','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsV6VemQ99-1589026330062-1 kuch bhi bol.png','Wishes','Wishes','Wishes','Wishes',1,18);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (64,NULL,'2020-05-09 12:13:17',101,NULL,'#d4a39e','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsoGqxpunR-1589026397526-18 Causes Bol.png','Blood Donation','Blood Donation','Blood Donation','Blood Donation',1,20);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (65,NULL,'2020-05-09 12:14:31',101,NULL,'#d4a39e','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsP0khDZ3r-1589026471954-18 Causes Bol.png','NGOs','NGOs','NGOs','NGOs',1,21);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (66,NULL,'2020-05-09 12:16:01',101,NULL,'#9abda7','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsqFxrjqKy-1589026561079-1 kuch bhi bol.png','Folklore','Folklore','Folklore','Folklore',1,24);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (67,NULL,'2020-05-09 12:16:53',101,NULL,'#e6e6c2','https://common-storage.cloudjiffy.net/lokpoll/mood_icons7NLlqEq4-1589037568079-15 Learning Bol.png','Talks','Talks','Talks','Talks',1,26);
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`,`imageUrl`,`hi`,`en`,`or`,`ta`,`isActive`,`position`) VALUES (68,NULL,'2020-05-09 12:17:32',101,NULL,'#f3ebc3','https://common-storage.cloudjiffy.net/lokpoll/mood_iconsTzqkkyYz-1589037578052-15 Learning Bol.png','Books','Books','Books','Books',1,27);

delete from coin_activity where activity is not null;

INSERT INTO lokpoll_test.coin_activity (activity, description, coins, updatedOn, position, name, `group`) VALUES
('signup', 'Coins to me, when i signs up', 100, '2020-10-09 13:11:19', 1, 'i signed up', 'signup'),
('frontLineSignup', 'Coins to me, when someone signs up in front line', 101, null, 2, 'sign up in front line', 'signup'),
('downLineSignup', 'Coins to me, when someone signs up in down line', 10, '2020-10-10 11:20:58', 3, null, 'signup'),
('dailyVisit', 'Coins to me, when i visit app first time in a day', 20, null, 4, null, 'dailyVisit'),
('frontLineDailyVisit', 'Coins to me, when someone in front line visits app first time in a day', 2, null, 5, null, 'dailyVisit'),
('downLineDailyVisit', 'Coins to me, when someone in down line visits app first time in a day', 1, null, 6, null, 'dailyVisit'),
('addPost', 'Coins to me, when i add new post with description only', 51, '2020-11-21 10:24:52', 7, null, 'addPost'),
('frontLineAddPost', 'Coins to me, when i add new post in front line with description only', 6, '2020-11-21 10:24:52', 8, null, 'addPost'),
('downLineAddPost', 'Coins to me, when i add new post in down line with description only', 1, '2020-11-21 10:24:52', 9, null, 'addPost'),
('addPostWithCustomText', 'Coins to me, when i add new post with custom text', 60, null, 10, null, 'addPostWithCustomText'),
('frontLineAddPostWithCustomText', 'Coins to me, when i add new post in front line with custom text', 60, null, 11, null, 'addPostWithCustomText'),
('downLineAddPostWithCustomText', 'Coins to me, when i add new post in down line with custom text', 60, null, 12, null, 'addPostWithCustomText'),
('addPostWithPhoto', 'Coins to me, when i add new post with photo', 50, null, 13, null, 'addPostWithPhoto'),
('frontLineAddPostWithPhoto', 'Coins to me, when i add new post in front line with photo', 50, null, 14, null, 'addPostWithPhoto'),
('downLineAddPostWithPhoto', 'Coins to me, when i add new post in down line with photo', 50, null, 15, null, 'addPostWithPhoto'),
('addPostWithVideo', 'Coins to me, when i add new post with video', 70, null, 16, null, 'addPostWithVideo'),
('frontLineAddPostWithVideo', 'Coins to me, when i add new post in front line with video', 70, null, 17, null, 'addPostWithVideo'),
('downLineAddPostWithVideo', 'Coins to me, when i add new post in down line with video', 70, null, 18, null, 'addPostWithVideo'),
('addPostWithAudio', 'Coins to me, when i add new post with audio', 60, null, 19, null, 'addPostWithAudio'),
('frontLineAddPostWithAudio', 'Coins to me, when i add new post in front line with audio', 60, null, 20, null, 'addPostWithAudio'),
('downLineAddPostWithAudio', 'Coins to me, when i add new post in down line with audio', 60, null, 21, null, 'addPostWithAudio'),
('addPostWithLink', 'Coins to me, when i add new post with link', 40, null, 22, null, 'addPostWithLink'),
('frontLineAddPostWithLink', 'Coins to me, when i add new post in front line with link', 40, null, 23, null, 'addPostWithLink'),
('downLineAddPostWithLink', 'Coins to me, when i add new post in down line with link', 40, null, 24, null, 'addPostWithLink'),
('addPostWithPoll', 'Coins to me, when i add new post with poll', 60, null, 25, null, 'addPostWithPoll'),
('frontLineAddPostWithPoll', 'Coins to me, when i add new post in front line with poll', 60, null, 26, null, 'addPostWithPoll'),
('downLineAddPostWithPoll', 'Coins to me, when i add new post in down line with poll', 60, null, 27, null, 'addPostWithPoll'),
('addContestPost', 'Coins to me, when i participate in contest', 40, null, 28, null, 'addContestPost'),
('frontLineAddContestPost', 'Coins to me, when someone in front line participate in contest', 40, null, 29, null, 'addContestPost'),
('downLineAddContestPost', 'Coins to me, when someone in down line participate in contest', 40, null, 30, null, 'addContestPost'),

('repost', 'Coins to me, when i share post internally (repost)', 40, null, 31, 'You Reposted', 'repost'),
('frontLineRepost', 'Coins to me, when someone in front line share post internally (repost)', 40, null, 32, 'someone in your frontline reposted', 'repost'),
('downLineRepost', 'Coins to me, when someone in down line share post internally (repost)', 40, null, 33, 'someone in your downline reposted', 'repost'),

('sharePost', 'Coins to me, when i share post externally (sharePost)', 40, null, 34, 'You Shared Post', 'sharePost'),
('frontLineSharePost', 'Coins to me, when someone in front line share post externally (sharePost)', 40, null, 35, 'someone in your frontline shared post', 'sharePost'),
('downLineSharePost', 'Coins to me, when someone in down line share post externally (sharePost)', 40, null, 36, 'someone in your downline shared post', 'sharePost'),
