import { Router, type IRouter } from "express";
import {
  addExtractionToCollection,
  createCollection,
  deleteFavorite,
  listCollections,
  listFavorites,
  saveFavorite,
} from "../services/organization";
import { recordAnalyticsEvent } from "../services/analytics";

const router: IRouter = Router();

router.get("/collections", async (_req, res) => {
  try {
    res.json({ data: await listCollections() });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "COLLECTIONS_LOAD_FAILED",
        message: error instanceof Error ? error.message : "Could not load collections.",
      },
    });
  }
});

router.post("/collections", async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name : "";
    const collection = await createCollection(name);
    await recordAnalyticsEvent({ eventType: "collection_created", metadata: { collectionId: collection.id, name: collection.name } });
    res.status(201).json({ data: collection });
  } catch (error) {
    res.status(400).json({
      error: {
        code: "COLLECTION_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Could not create collection.",
      },
    });
  }
});

router.post("/collections/:id/extractions", async (req, res) => {
  try {
    const extractionId = typeof req.body?.extractionId === "string" ? req.body.extractionId : "";
    await addExtractionToCollection(req.params.id, extractionId);
    res.status(201).json({ data: { collectionId: req.params.id, extractionId } });
  } catch (error) {
    res.status(400).json({
      error: {
        code: "COLLECTION_SAVE_FAILED",
        message: error instanceof Error ? error.message : "Could not save extraction to collection.",
      },
    });
  }
});

router.get("/favorites", async (_req, res) => {
  try {
    res.json({ data: await listFavorites() });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "FAVORITES_LOAD_FAILED",
        message: error instanceof Error ? error.message : "Could not load favorites.",
      },
    });
  }
});

router.post("/favorites", async (req, res) => {
  try {
    const favorite = await saveFavorite(req.body);
    await recordAnalyticsEvent({
      eventType: favorite.targetType === "catalog_item" ? "idea_saved" : favorite.targetType === "opportunity" ? "opportunity_saved" : "favorite_added",
      extractionId: favorite.extractionId,
      metadata: { targetType: favorite.targetType, itemTitle: favorite.itemTitle },
    });
    res.status(201).json({ data: favorite });
  } catch (error) {
    res.status(400).json({
      error: {
        code: "FAVORITE_SAVE_FAILED",
        message: error instanceof Error ? error.message : "Could not save favorite.",
      },
    });
  }
});

router.delete("/favorites/:id", async (req, res) => {
  try {
    await deleteFavorite(req.params.id);
    res.json({ data: { id: req.params.id, deleted: true } });
  } catch (error) {
    res.status(400).json({
      error: {
        code: "FAVORITE_DELETE_FAILED",
        message: error instanceof Error ? error.message : "Could not remove favorite.",
      },
    });
  }
});

export default router;
