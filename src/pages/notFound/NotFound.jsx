import { Link } from "react-router-dom";
import { Container, Button } from "react-bootstrap";

function NotFound() {
  return (
    <Container className="d-flex flex-column justify-content-center align-items-center vh-100 text-center">
      <h1 className="display-1 fw-bold text-primary">404</h1>

      <h2 className="mb-3">Page Not Found</h2>

      <p className="text-muted mb-4">
        Sorry, the page you are looking for doesn't exist or has been moved.
      </p>

      <Link to="/">
        <Button variant="primary">Go to Home</Button>
      </Link>
    </Container>
  );
}

export default NotFound;