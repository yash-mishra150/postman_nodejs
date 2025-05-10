import {
    Entity,
    PrimaryKey,
    Property,
  } from '@mikro-orm/core';
  
  @Entity()
  export class RequestLog {
    @PrimaryKey()
    id!: number;
  
    @Property()
    method!: string;
  
    @Property()
    url!: string;
  
    @Property({ type: 'json' })
    headers!: object;
  
    @Property({ type: 'json', nullable: true })
    requestBody?: object;
  
    @Property({ type: 'json', nullable: true })
    responseBody?: object;
  
    @Property()
    statusCode!: number;
  
    @Property()
    timestamp: Date = new Date();

    @Property()
    responseTime!: number;

    @Property({ type: 'text', nullable: true })
    error?: string;
  }
  