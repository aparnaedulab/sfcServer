# Node.js Starter

# Features

- Express/MongoDB back-end
- ngx-admin template with 100+ UI components
- Only important features you need
- Authentication using JWT tokens is implemented and integrated in both client and server side
- Basic role management and ACL is in place
- code quality under the hood - tslint is set up as part of Angular project settings, it simply wouldn't let you push typescript code with errors
- backend solution layered architecture and projects segregation
- MongoDB client for backend data access with the ability to easily replace it with other data access
Swagger included for automatic API testing and documentation
- winston is used for logging
- node-config is used for configure application settings
- nodemon is used for better experience while develop
- Documentation is included
- 6 months free updates

# Docker Installation for development 

docker run -it --rm -e MYSQL_PWD=<user pass> mysql:5.7 mysqldump -u <user> -h <ip address> -P 3306 database 1> backup.sql
# please be wait it will take sometime
docker cp backup.sql gu_superadmin_db:/tmp
# go inside terminal and issue this command after issuing command enter the password as password
mysql -u root -p GU_SFC < /tmp/backup.sql
