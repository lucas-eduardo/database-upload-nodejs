import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import TransactionRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import Transaction from '../models/Transaction';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    category,
    type,
  }: RequestDTO): Promise<Transaction> {
    let category_id: string;
    const categorysRepository = getRepository(Category);
    const transactionRep = getCustomRepository(TransactionRepository);
    const transactionsRepository = getRepository(Transaction);

    if (type === 'outcome') {
      const { income } = await transactionRep.getBalance();
      if (income < value) {
        throw new AppError('Unable to continue registration', 400);
      }
    }

    const categoryDB = await categorysRepository.findOne({
      where: { title: category },
    });

    if (!categoryDB) {
      const newCategory = categorysRepository.create({ title: category });
      category_id = (await categorysRepository.save(newCategory)).id;
    } else {
      category_id = categoryDB.id;
    }

    const transaction = transactionsRepository.create({
      category_id,
      title,
      value,
      type,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
