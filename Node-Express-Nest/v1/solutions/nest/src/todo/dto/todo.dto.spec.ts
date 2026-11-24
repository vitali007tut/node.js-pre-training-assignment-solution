import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTodoDto } from './create-todo.dto';
import { UpdateTodoDto } from './update-todo.dto';

describe('Todo DTO validation', () => {
  it('requires a positive user id when creating a todo', async () => {
    const missingUserDto = plainToInstance(CreateTodoDto, { title: 'Learn SQL' });
    expect(await validate(missingUserDto)).not.toHaveLength(0);

    const invalidUserDto = plainToInstance(CreateTodoDto, {
      title: 'Learn SQL',
      userId: 0,
    });
    expect(await validate(invalidUserDto)).not.toHaveLength(0);

    const validDto = plainToInstance(CreateTodoDto, {
      title: 'Learn SQL',
      userId: 1,
    });
    expect(await validate(validDto)).toHaveLength(0);
  });

  it('requires a non-empty string title when creating a todo', async () => {
    const invalidDto = plainToInstance(CreateTodoDto, {
      title: '',
      userId: 1,
    });
    const errors = await validate(invalidDto);

    expect(errors.map((error) => error.property)).toContain('title');
  });

  it('allows a partial update but rejects unknown fields', async () => {
    const validDto = plainToInstance(UpdateTodoDto, {
      description: 'Add validation',
    });
    expect(await validate(validDto)).toHaveLength(0);

    const nullValueDto = plainToInstance(UpdateTodoDto, { title: null });
    expect(await validate(nullValueDto)).not.toHaveLength(0);

    const invalidDto = plainToInstance(UpdateTodoDto, {
      description: 'Add validation',
      unexpected: true,
    });
    const errors = await validate(invalidDto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.map((error) => error.property)).toContain('unexpected');
  });
});
