/* eslint-disable no-undef */
const request = require("supertest");
const db = require("../models/index");
const app = require("../app");

let server, agent;

const signin = async () => {
  await agent
    .post("/session")
    .send({ name: "first@last.com", password: "abcdefg" });
};

describe("First test suit",()=>{
   test("first case",()=>{
    expect(true).toBe(true);
   }) 
})

describe("Features Test Suits",()=>{
   beforeAll(async () => {
      await db.sequelize.sync({ force: true });
      server = app.listen(3000, () => {});
      agent = request.agent(server);
    });
  
    afterAll(async () => {
      await db.sequelize.close();
      server.close();
    });

    test("Signin Test", async () => {
      const res = await agent.get("/index");
      expect(res.statusCode).toBe(302);
    });
  
    test("Admin authentication Test", async () => {
      const res = await agent.get("/signup");
      expect(res.statusCode).toBe(200);
      const signin = await agent.get("/signin");
      expect(signin.statusCode).toBe(200);
    });
  
    test("Admin signup test", async () => {
      const res = await agent.post("/users").send({
        name: "admin",
        email: "first@last.com",
        password: "abcdefg",
      });
      expect(res.statusCode).toBe(302);
    });
  
    test("Admin signout test", async () => {
      signin();
      await agent.get("/signout");
      const res = await agent.get("/index");
      expect(res.statusCode).toBe(302);
    }); 
})