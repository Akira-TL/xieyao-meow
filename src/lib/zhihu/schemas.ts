import { z } from "zod";

const identifierSchema = z.union([z.string(), z.number().int()]).transform(String);

export const pagingSchema = z.object({
  IsEnd: z.boolean(),
  NextOffset: z.union([z.string(), z.number().int()]).transform(String).optional(),
  Totals: z.number().int().optional(),
});

export const contentItemSchema = z.object({
  ContentType: z.enum(["answer", "article", "zvideo", "pin", "question"]),
  Url: z.string(),
  CreatedAt: z.number().int(),
  LikeCount: z.number().int(),
  CommentCount: z.number().int(),
  FavoriteCount: z.number().int(),
  Title: z.string(),
  Summary: z.string(),
});

export const followeeItemSchema = z.object({
  Fullname: z.string(),
  UrlToken: z.string(),
  Url: z.string(),
  AvatarUrl: z.string(),
  Headline: z.string(),
  Gender: z.number().int(),
  FollowerCount: z.number().int(),
});

export const favlistRefSchema = z.object({
  UrlToken: identifierSchema,
  Title: z.string(),
  Url: z.string(),
});

export const authorSchema = z.object({
  Name: z.string(),
  UrlToken: z.string(),
  Url: z.string(),
  Gender: z.number().int(),
  Headline: z.string(),
});

export const collectionItemSchema = z.object({
  ContentType: z.enum(["answer", "article", "zvideo", "pin", "question"]),
  Url: z.string(),
  CreatedAt: z.number().int(),
  FavTime: z.number().int(),
  LikeCount: z.number().int(),
  CommentCount: z.number().int(),
  FavoriteCount: z.number().int(),
  Title: z.string(),
  Summary: z.string(),
  Favlists: z.array(favlistRefSchema),
  Author: authorSchema.optional(),
});

export const favlistItemSchema = z.object({
  UrlToken: identifierSchema,
  Url: z.string(),
  Title: z.string(),
  Description: z.string(),
  IsPublic: z.boolean(),
});

export const contentsEnvelopeSchema = z.object({
  Code: z.number().int(),
  Message: z.string(),
  Data: z.object({
    Items: z.array(contentItemSchema),
    Paging: pagingSchema,
  }).nullable(),
});

export const followeesEnvelopeSchema = z.object({
  Code: z.number().int(),
  Message: z.string(),
  Data: z.object({
    Items: z.array(followeeItemSchema),
    Paging: pagingSchema,
  }).nullable(),
});

export const collectionsEnvelopeSchema = z.object({
  Code: z.number().int(),
  Message: z.string(),
  Data: z.object({
    Items: z.array(collectionItemSchema),
  }).nullable(),
});

export const favlistsEnvelopeSchema = z.object({
  Code: z.number().int(),
  Message: z.string(),
  Data: z.object({
    Items: z.array(favlistItemSchema),
  }).nullable(),
});

export const oauthTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().int().positive(),
});
