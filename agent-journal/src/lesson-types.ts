export type LessonSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  code?: string;
};

export type Lesson = {
  id: number;
  title: string;
  domain: string;
  question: string;
  lead: string;
  sections: LessonSection[];
  diagram: {
    title: string;
    chart: string;
  };
  takeaway: string;
  sourcePointers: string[];
};
