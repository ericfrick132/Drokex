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

# Copy nginx template and entrypoint for env-based proxy config
COPY nginx.template.conf /etc/nginx/nginx.template.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
