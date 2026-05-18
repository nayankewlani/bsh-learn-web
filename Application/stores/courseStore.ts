import { create } from "zustand";
import client from "../api/client";

export interface Course {
  _id: string;
  title: string;
  description: string;
  educator: { _id: string; name: string; avatar?: string };
  category: string;
  level: string;
  price: number;
  discountPrice?: number;
  thumbnail: string;
  rating: number;
  ratingCount: number;
  enrollmentCount: number;
  totalLessons: number;
  totalDuration: number;
  isPublished: boolean;
  language: string;
  tags: string[];
  requirements: string[];
  objectives: string[];
}

export interface Chapter {
  _id: string;
  title: string;
  order: number;
}

export interface Lesson {
  _id: string;
  title: string;
  chapter: string;
  type: string;
  order: number;
  duration: number;
  isFree: boolean;
  muxPlaybackId?: string;
}

interface CourseState {
  courses: Course[];
  featuredCourses: Course[];
  currentCourse: Course | null;
  chapters: Chapter[];
  lessons: Lesson[];
  enrolledCourses: { course: Course; progress: number }[];
  isLoading: boolean;
  total: number;
  page: number;
  totalPages: number;

  fetchCourses: (params?: Record<string, string | number>) => Promise<void>;
  fetchFeatured: () => Promise<void>;
  fetchCourseDetail: (id: string) => Promise<{ course: Course; chapters: Chapter[]; lessons: Lesson[]; isEnrolled: boolean }>;
  fetchMyCourses: () => Promise<void>;
  searchCourses: (q: string, params?: Record<string, string>) => Promise<Course[]>;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  featuredCourses: [],
  currentCourse: null,
  chapters: [],
  lessons: [],
  enrolledCourses: [],
  isLoading: false,
  total: 0,
  page: 1,
  totalPages: 1,

  fetchCourses: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await client.get("/courses", { params });
      set({ courses: data.courses, total: data.total, page: data.page, totalPages: data.totalPages, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchFeatured: async () => {
    try {
      const { data } = await client.get("/courses/featured");
      set({ featuredCourses: data.courses });
    } catch {}
  },

  fetchCourseDetail: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await client.get(`/courses/${id}`);
      set({ currentCourse: data.course, chapters: data.chapters, lessons: data.lessons, isLoading: false });
      return data;
    } catch {
      set({ isLoading: false });
      throw new Error("Failed to load course");
    }
  },

  fetchMyCourses: async () => {
    try {
      const { data } = await client.get("/my-courses");
      set({ enrolledCourses: data.enrollments.map((e: { course: Course; progress: number }) => ({ course: e.course, progress: e.progress })) });
    } catch {}
  },

  searchCourses: async (q, params = {}) => {
    try {
      const { data } = await client.get("/search", { params: { q, ...params } });
      return data.courses;
    } catch {
      return [];
    }
  },
}));
