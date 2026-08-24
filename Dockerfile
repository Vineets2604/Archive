FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install
COPY . .
RUN npx prisma generate && npm run build
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app ./
EXPOSE 4000
CMD ["npm","run","start","-w","apps/api"]
