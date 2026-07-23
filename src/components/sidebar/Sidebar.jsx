import { Nav } from "react-bootstrap";
import { AiFillMessage } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";
import { IoMdLogOut } from "react-icons/io";
import { RiContactsFill } from "react-icons/ri";

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
          <AiFillMessage/> DM
        </Nav.Link>

        <Nav.Link
          href="#"
          className={activeTab === "contacts" ? "text-white fw-bold" : "text-secondary"}
          onClick={() => setActiveTab("contacts")}
        >
          <RiContactsFill/> Contacts
        </Nav.Link>

        <Nav.Link
          href="#"
          className={activeTab === "profile" ? "text-white fw-bold" : "text-secondary"}
          onClick={() => setActiveTab("profile")}
        >
          <CgProfile/> Profile
        </Nav.Link>
      </Nav>

      <div className="mt-auto">
        <Nav.Link
          href="#"
          className="text-danger"
          onClick={() => alert("Logout")}
        >
          <IoMdLogOut/> Logout
        </Nav.Link>
      </div>
    </div>
  );
}

export default Sidebar;