import { Nav } from "react-bootstrap";

function Sidebar({ activeTab, setActiveTab }) {
  return (
    <div
      className="d-flex flex-column bg-dark text-white p-3"
      style={{ width: "170px", height: "100vh" }}
    >
      <h4 className="mb-4">Chat App</h4>

      <Nav className="flex-column">
        <Nav.Link
          href="#"
          className={activeTab === "dm" ? "text-white fw-bold" : "text-secondary"}
          onClick={() => setActiveTab("dm")}
        >
          💬 DM
        </Nav.Link>

        <Nav.Link
          href="#"
          className={activeTab === "contacts" ? "text-white fw-bold" : "text-secondary"}
          onClick={() => setActiveTab("contacts")}
        >
          👥 Contacts
        </Nav.Link>

        <Nav.Link
          href="#"
          className={activeTab === "profile" ? "text-white fw-bold" : "text-secondary"}
          onClick={() => setActiveTab("profile")}
        >
          👤 Profile
        </Nav.Link>
      </Nav>

      <div className="mt-auto">
        <Nav.Link
          href="#"
          className="text-danger"
          onClick={() => alert("Logout")}
        >
          🚪 Logout
        </Nav.Link>
      </div>
    </div>
  );
}

export default Sidebar;