# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Bundle app source
COPY . .

# Generate Prisma Client and build the app
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev
RUN npx prisma generate

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
