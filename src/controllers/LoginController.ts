import { Request, Response } from "express";
import Joi from "joi";
import bcrypt from "bcrypt";

import createUserToken from "../helpers/createToken";

const passwordSchemaCreate = Joi.object({
  senha: Joi.string().min(3).max(11).required(),
});

export default class LoginController {
  static validatePasswordData(data: any) {
    const { error, value } = passwordSchemaCreate.validate(data);

    if (error) {
      const message = "Dados inválidos.";
      const details = error.details.map((detail) => {
        switch (detail.path[0]) {
          case "senha":
            return "Senha está inválida ou não existe.";
          default:
            return "Não é possível inserir outros dados além da senha.";
        }
      });
      return { valid: false, message, details };
    }
    return { valid: true, value };
  }

  static async login(req: Request, res: Response) {
    const { valid, value, message, details } = this.validatePasswordData(
      req.body
    );

    if (!valid) {
      return res.status(400).json({ message, errorMessage: details });
    }

    const correctPasswordHash = process.env.CORRECT_PASSWORD_TO_LOGIN;

    if (!correctPasswordHash) {
      throw new Error(
        "Senha correta não está definida nas variáveis de ambiente"
      );
    }

    const isPasswordValid = await bcrypt.compare(
      value.senha,
      correctPasswordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    await createUserToken(req, res);
  }
}