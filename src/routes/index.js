const { fetch } = require("cross-fetch");
require("dotenv").config();
const { API_KEY } = process.env;
const { Router } = require("express");
const { Diet, Recipe, Recipeapi, Op } = require("../db.js");

// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

router.get("/recipes", async (req, res, next) => {
  const { name } = req.query;
  let allRecipes = [];

  const join = [
    {
      model: Diet,
      attributes: ["name"],
      through: {
        attributes: [],
      },
    },
  ];

  try {
    if ((await Recipeapi.count()) === 0) {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&addRecipeInformation=true&number=70`
      );
      const data = await response.json();
      if (data.results) {
        let recetaAPI = [];
        recetaAPI = data.results.map((e) => {
          return {
            title: e.title,
            summary: e.summary,
            healthScore: e.healthScore,
            steps: e.analyzedInstructions[0]?.steps
              .map((e) => e.step)
              .join(" "),
            image: e.image,
            diets: e.diets,
          };
        });
        await Recipeapi.bulkCreate(recetaAPI);
      }
    }

    if (name) {
      try {
        const recipesBD = await Recipe.findAll({
          where: {
            title: {
              [Op.iLike]: name + "%",
            },
          },
          attributes: ["id", "title", "healthScore", "image"],
          include: join,
        });

        if (recipesBD) {
          const rBD = recipesBD.map((e) => {
            return {
              id: e.id,
              title: e.title[0].toUpperCase() + e.title.substring(1),
              healthScore: e.healthScore,
              image: e.image,
              diets: e.diets.map((d) => d.name),
            };
          });
          allRecipes = [...rBD];
        }
        const recipesAPI = await Recipeapi.findAll({
          where: {
            title: {
              [Op.iLike]: name + "%",
            },
          },
          attributes: ["id", "title", "healthScore", "image", "diets"],
        });
        // const recipesAPI = recetaAPI.filter((e) => {
        //   return e.title.toUpperCase().includes(name.toUpperCase()) === true;
        // });

        if (recipesAPI) {
          allRecipes = [...allRecipes, ...recipesAPI];
        }
        if (allRecipes.length > 0) {
          res.status(200).json(allRecipes);
        }
        if (allRecipes.length === 0) {
          res.status(404).json({ message: "404" });
        }
      } catch (err) {
        next(err);
      }
    } else {
      try {
        let recipesBD = await Recipe.findAll({
          attributes: ["id", "title", "healthScore", "image"],
          include: join,
        });

        recipesBD = recipesBD.map((e) => {
          return {
            id: e.id,
            title: e.title[0].toUpperCase() + e.title.substring(1),
            healthScore: e.healthScore,
            image: e.image,
            diets: e.diets.map((d) => d.name),
          };
        });
        let recipesAPI = await Recipeapi.findAll({
          attributes: ["id", "title", "healthScore", "image", "diets"],
        });

        res.status(200).json([...recipesBD, ...recipesAPI]);
      } catch (err) {
        next(err);
      }
    }
  } catch (err) {
    next(err);
  }
});
router.get("/recipes/:id", async (req, res, next) => {
  let { id } = req.params;

  try {
    // if (id.includes("-") === false) {
    //   let ID = parseInt(id);
    //   const response = await fetch(
    //     `https://api.spoonacular.com/recipes/${ID}/information?apiKey=${API_KEY}`
    //   );
    //   const data = await response.json();
    //   if (data) {
    //     const recipeAPI = {
    //       id: data.id,
    //       title: data.title,
    //       summary: data.summary,
    //       healthScore: data.healthScore,
    //       steps: data.instructions,
    //       image: data.image,
    //       diets: data.diets,
    //     };
    //     return res.status(200).json(recipeAPI);
    //   }
    // }
    const recipeAPI = await Recipeapi.findByPk(id);
    if (recipeAPI) {
      return res.status(200).json(recipeAPI);
    }
    const recipeBD = await Recipe.findByPk(id, {
      include: [
        {
          model: Diet,
          attributes: ["name"],
          through: {
            attributes: [],
          },
        },
      ],
    });
    if (recipeBD) {
      let rBD = {
        id: recipeBD.id,
        title: recipeBD.title,
        summary: recipeBD.summary,
        steps: recipeBD.steps,
        healthScore: recipeBD.healthScore,
        image: recipeBD.image,
        diets: recipeBD.diets.map((d) => d.name),
      };
      return res.status(200).json(rBD);
    }
  } catch (err) {
    next(err);
  }
});
router.post("/recipes", async (req, res, next) => {
  let { title, summary, healthScore, steps, image, diets } = req.body;

  if (image === "") {
    image =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBymBCsn8jubRKWfn4hhh4wfoTfwRcrVi21h5x5deDQoDNHPJk5EmEnhLMTFvMv7gSkro&usqp=CAU";
  }
  try {
    const recipe = await Recipe.create({
      title,
      summary,
      healthScore,
      steps,
      image,
    });
    await recipe.addDiet(diets);
    res.status(201).json(recipe);
  } catch (err) {
    next(err);
  }
});
router.get("/diets", async (req, res, next) => {
  try {
    let diets = await Diet.findAll();
    res.status(200).json(diets);
  } catch (err) {
    next(err);
  }
});
module.exports = router;
