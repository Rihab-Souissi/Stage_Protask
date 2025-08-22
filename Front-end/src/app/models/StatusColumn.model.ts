import { Ticket } from "./Ticket.model";

export interface StatusColumn {
   key: Ticket['status'];
  label: string;
  color: string;
  tickets: Ticket[];
  disabled: boolean;
}
