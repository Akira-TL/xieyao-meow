export type ZhihuContentType = "answer" | "article" | "zvideo" | "pin" | "question";

export interface ZhihuContent {
  contentType: ZhihuContentType;
  url: string;
  createdAt: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  title: string;
  summary: string;
}

export interface ZhihuFollowee {
  fullname: string;
  urlToken: string;
  url: string;
  avatarUrl: string;
  headline: string;
  gender: number;
  followerCount: number;
}

export interface ZhihuFavlistRef {
  urlToken: string;
  title: string;
  url: string;
}

export interface ZhihuAuthor {
  name: string;
  urlToken: string;
  url: string;
  gender: number;
  headline: string;
}

export interface ZhihuCollection {
  contentType: ZhihuContentType;
  url: string;
  createdAt: number;
  favTime: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  title: string;
  summary: string;
  favlists: ZhihuFavlistRef[];
  author?: ZhihuAuthor;
}

export interface ZhihuFavlist {
  urlToken: string;
  url: string;
  title: string;
  description: string;
  isPublic: boolean;
}

export interface UserProfile {
  fetchedAt: number;
  contents: ZhihuContent[];
  followees: ZhihuFollowee[];
  collections: ZhihuCollection[];
  favlists: ZhihuFavlist[];
}

export interface OAuthSession {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface ZhihuOAuthUserIdentity {
  providerSubject: string;
  name?: string;
  avatarUrl?: string;
  headline?: string;
  url?: string;
}

export interface ZhihuOAuthConfig {
  appId: string;
  appKey: string;
  redirectUri: string;
}

export interface GetUserProfileInput {
  oauthAccessToken?: string;
}

export interface ZhihuHotItem {
  title: string;
  url: string;
  thumbnailUrl: string;
  summary: string;
}

export interface ZhihuSearchItem {
  title: string;
  url: string;
  summary: string;
  contentType: string;
  rankingScore: number;
}

export interface ZhihuAnswerSummary {
  contentToken: string;
  url: string;
  summary: string;
}

export type ZhidaModel = "zhida-fast-1p5" | "zhida-thinking-1p5" | "zhida-agent";

export interface ZhidaMessage {
  role: string;
  content: string;
}

export interface ZhidaRequest {
  model: ZhidaModel;
  messages: ZhidaMessage[];
}

export interface ZhidaResult {
  model: string;
  content: string;
  reasoningContent?: string;
  finishReason: string | null;
}
