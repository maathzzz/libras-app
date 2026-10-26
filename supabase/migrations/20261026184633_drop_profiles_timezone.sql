-- The streak's "day" is now the device's local date, sent by the app with each request
-- and in the lesson completion. The BFF no longer reads the learner's zone.
alter table app.profiles drop column timezone;
