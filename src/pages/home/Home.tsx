import { Link } from "react-router";
import { Button, Container, Overlay, Group } from "@mantine/core";

import classes from "./Home.module.css";
import { ROUTES } from "../../router/routes";
import { COGNITO_LOGIN_URL } from "../../config/cognito";
export default function Home() {
  return (
    <div className={classes.hero}>
      <Overlay
        gradient="linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, .65) 40%)"
        opacity={1}
        zIndex={0}
      />
      <Container size="md">
        {/* <Title className={classes.title}>
          A fully featured React components library
        </Title>
        <Text className={classes.description} size="xl" mt="xl">
          Build fully functional accessible web applications faster than ever –
          Mantine includes more than 120 customizable components and hooks to
          cover you in any situation
        </Text> */}

        <Group className={classes.controls}>
          <Button
            component={Link}
            to={ROUTES.REGISTER}
            variant="gradient"
            size="xl"
            radius="xl"
            className={classes.control}
          >
            Sign Up
          </Button>
          <Button
            component="a"
            href={COGNITO_LOGIN_URL}
            variant="gradient"
            size="xl"
            radius="xl"
            className={classes.control}
          >
            Login
          </Button>
        </Group>
      </Container>
    </div>
  );
}
