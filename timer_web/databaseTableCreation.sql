CREATE TABLE "timers" (
	"name"	TEXT UNIQUE,
	"password"	TEXT,
	"endTime"	INTEGER,
	PRIMARY KEY("name")
);