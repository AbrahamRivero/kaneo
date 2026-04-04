

# PalcoDesk



[license](LICENSE)



A modern, self-hosted project management platform that gets out of your way.

## Why PalcoDesk?

We built PalcoDesk because existing project management tools either feel bloated with features you'll never use, or they're too simple to handle real work. PalcoDesk finds the sweet spot—powerful enough for complex projects, simple enough that you'll actually want to use it.

**What makes it different:**

- **Clean interface** that focuses on your work, not the tool
- **Self-hosted** so your data stays yours
- **Actually fast** because we care about performance
- **Open source** and free forever

## Getting Started

### Quick Start with Docker Compose

The fastest way to try PalcoDesk is with Docker Compose. This sets up the API, web interface, and PostgreSQL database:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: palcodesk
      POSTGRES_USER: palcodesk_user
      POSTGRES_PASSWORD: palcodesk_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    image: ghcr.io/usepalcodesk/api:latest
    environment:
      JWT_ACCESS: "your-secret-key-here"
      DATABASE_URL: "postgresql://palcodesk_user:palcodesk_password@postgres:5432/palcodesk"
    ports:
      - 1337:1337
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    image: ghcr.io/usepalcodesk/web:latest
    environment:
      PALCODESC_API_URL: "http://localhost:1337"
    ports:
      - 5173:5173
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

Save this as `compose.yml`, run `docker compose up -d`, and open [http://localhost:5173](http://localhost:5173).

> **Quick tip:** Change `JWT_ACCESS` to something secure in production. This is used to sign authentication tokens.

### Development Setup

For development, see our [Environment Setup Guide](ENVIRONMENT_SETUP.md) for detailed instructions on configuring environment variables and troubleshooting common issues like CORS problems.

### Configuration Options


| Variable               | What it does                       | Default  |
| ---------------------- | ---------------------------------- | -------- |
| `PALCODESC_API_URL`    | Where the web app finds the API    | Required |
| `JWT_ACCESS`           | Secret key for user authentication | Required |
| `DATABASE_URL`         | PostgreSQL connection string       | Required |
| `DISABLE_REGISTRATION` | Block new user signups             | `true`   |


### Database Setup

PalcoDesk uses PostgreSQL for data storage. The Docker Compose setup above handles this automatically, but if you're running PalcoDesk outside of Docker, or if you are using an external postgres database, you'll need to:

1. **Install PostgreSQL** (version 12 or higher)
2. **Create a database and user:**
  ```sql
   CREATE DATABASE palcodesk;
   CREATE USER palcodesk_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE palcodesk TO palcodesk_user;

   \c palcodesk;
   GRANT USAGE ON SCHEMA public TO palcodesk_user;
   GRANT CREATE ON SCHEMA public TO palcodesk_user;
   ALTER SCHEMA public OWNER TO palcodesk_user;
  ```
3. **Set the DATABASE_URL environment variable:**
  ```bash
   export DATABASE_URL="postgresql://palcodesk_user:your_password@localhost:5432/palcodesk"
  ```

## Kubernetes Deployment

If you're running Kubernetes, we have a Helm chart that handles the complexity:

```bash
# Clone the repo
git clone https://github.com/AbrahamRivero/kaneo.git
cd palcodesk

# Install with Helm
helm install palcodesk ./charts/palcodesk --namespace palcodesk --create-namespace

# Access locally
kubectl port-forward svc/palcodesk-web 5173:5173 -n palcodesk
```

Open [http://localhost:5173](http://localhost:5173) and you're good to go.

### Production Setup

For real deployments, you'll want proper ingress:

```bash
helm install palcodesk ./charts/palcodesk \
  --namespace palcodesk \
  --create-namespace \
  --set ingress.enabled=true \
  --set ingress.className=nginx \
  --set "ingress.hosts[0].host=pm.yourcompany.com"
```

Check the [Helm chart docs](./charts/palcodesk/README.md) for TLS setup, cert-manager integration, and other production considerations.

## Development

Want to hack on PalcoDesk? See our [Environment Setup Guide](ENVIRONMENT_SETUP.md) for detailed instructions on configuring environment variables and troubleshooting common issues like CORS problems.

Quick start:

```bash
# Clone and install dependencies
git clone https://github.com/AbrahamRivero/kaneo.git
cd palcodesk
pnpm install

# Copy environment files
cp apps/api/.env.sample apps/api/.env
cp apps/web/.env.sample apps/web/.env

# Update environment variables as needed
# See ENVIRONMENT_SETUP.md for detailed instructions

# Start development servers
pnpm dev
```

## Migration from SQLite

If you're upgrading from a previous version that used SQLite, you'll need to migrate your data to PostgreSQL. We recommend:

1. **Export your data** from the old SQLite database
2. **Set up PostgreSQL** using the new Docker Compose configuration
3. **Import your data** into the new PostgreSQL database

## Community

- **[GitHub Issues](https://github.com/AbrahamRivero/kaneo/issues)** - Bug reports and feature requests

## Contributing

We're always looking for help, whether that's:

- Reporting bugs or suggesting features
- Improving documentation
- Contributing code
- Helping other users on Discord

Check out [CONTRIBUTING.md](CONTRIBUTING.md) for the details on how to get involved.

## License

MIT License - see [LICENSE](LICENSE) for details.

---



Built with ❤️ by the PalcoDesk team