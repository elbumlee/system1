import { JobData } from "../services/parser/parser.interface";

const TTL_MS = 15 * 60 * 1000; // 15분
const jobs = new Map<string, JobData>();
const timers = new Map<string, NodeJS.Timeout>();

export const jobStore = {
  set(id: string, data: JobData) {
    jobs.set(id, data);
    if (timers.has(id)) clearTimeout(timers.get(id)!);
    timers.set(
      id,
      setTimeout(() => this.delete(id), TTL_MS)
    );
  },

  get(id: string): JobData | undefined {
    return jobs.get(id);
  },

  delete(id: string) {
    jobs.delete(id);
    if (timers.has(id)) {
      clearTimeout(timers.get(id)!);
      timers.delete(id);
    }
  },

  clearAll() {
    for (const [id] of jobs) this.delete(id);
  },

  activeCount(): number {
    return jobs.size;
  },
};