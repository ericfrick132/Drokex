# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./
# Install git for GitHub deps (react-bits)
RUN apk add --no-cache git \
    && npm install

# Copy source code and build
COPY src ./src
COPY public ./public
COPY tsconfig.json ./
RUN npm run build

# Runtime stage with nginx
FROM nginx:alpine AS runtime
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
