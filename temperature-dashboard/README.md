npm install express mongoose ws body-parser cors uuid  # Core backend
npm install --save-dev nodemon # For development server restarts

sudo docker pull mongo:latest
sudo docker run -d -p 27017:27017 --name=mongo-temperature-dashboard mongo:latest
docker start mongo-temperature-dashboard
docker ps 

docker exec -it mongo-temperature-dashboard mongosh